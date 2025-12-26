import { db } from "../memory/memoryStore";

export function checkDuplicate(
  vendor: string,
  invoiceNumber: string
): Promise<boolean> {
  return new Promise((resolve) => {
    db.get(
      `SELECT id FROM audit_trail WHERE details LIKE ?`,
      [`%${vendor}%${invoiceNumber}%`],
      (err, row) => {
        if (err || !row) resolve(false);
        else resolve(true);
      }
    );
  });
}
