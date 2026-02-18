import { SheetRow } from './sheets';
import prisma from './prisma';

export interface StrippingRule {
  columnName: string;
  action: 'remove'; // Future: could add 'hash', 'mask', etc.
}

export interface ClientStrippingConfig {
  clientId: string;
  isMedical: boolean;
  rules: StrippingRule[];
}

const DEFAULT_MEDICAL_RULES: StrippingRule[] = [
  { columnName: 'First Name', action: 'remove' },
  { columnName: 'Last Name', action: 'remove' },
  { columnName: 'Phone', action: 'remove' },
  { columnName: 'Email', action: 'remove' },
];

export async function getStrippingConfig(clientId: string): Promise<ClientStrippingConfig> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client) {
    throw new Error(`Client not found: ${clientId}`);
  }

  return {
    clientId,
    isMedical: client.isMedical,
    rules: client.isMedical ? DEFAULT_MEDICAL_RULES : [],
  };
}

export function stripPII(
  rows: SheetRow[],
  config: ClientStrippingConfig
): { strippedRows: SheetRow[]; strippedColumns: Set<string> } {
  const strippedColumns = new Set<string>();

  if (!config.isMedical || config.rules.length === 0) {
    return { strippedRows: rows, strippedColumns };
  }

  const strippedRows = rows.map((row) => {
    const newRow = { ...row };
    config.rules.forEach((rule) => {
      // Case-insensitive column lookup
      const columnKey = Object.keys(newRow).find(
        (key) => key.toLowerCase() === rule.columnName.toLowerCase()
      );

      if (columnKey && newRow[columnKey] !== null && newRow[columnKey] !== undefined) {
        strippedColumns.add(columnKey);
        delete newRow[columnKey];
      }
    });
    return newRow;
  });

  return { strippedRows, strippedColumns };
}

export async function logStripping(
  clientId: string,
  sheetName: string,
  strippedColumns: Set<string>,
  rowCount: number
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      clientId,
      action: 'PII_STRIPPED',
      details: {
        sheetName,
        strippedColumns: Array.from(strippedColumns),
        rowCount,
        timestamp: new Date().toISOString(),
      },
    },
  });
}
