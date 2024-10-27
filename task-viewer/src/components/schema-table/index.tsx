import type { Description } from "joi";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SchemaTableRow } from "../schema-table-row";

export const SchemaTable = ({
  schema,
  className,
}: {
  schema: Description;
  className?: string;
}) => {
  if (!schema) {
    return <div className="p-6">No schema available</div>;
  }

  const renderRows = (keys: Record<any, any>) => {
    return Object.entries(keys).map(([key, value], index) => (
      <SchemaTableRow
        key={index}
        fieldName={key}
        schema={value}
        columnCount={4}
      />
    ));
  };

  const isMultipleType = Object.keys(schema.keys ?? {}).length > 0;
  if (isMultipleType) {
    return (
      <Table className={className}>
        <TableHeader>
          <TableRow>
            <TableCell align="left" className="font-bold" width={180}>
              Key
            </TableCell>
            <TableCell align="left" className="font-bold" width={220}>
              Type
            </TableCell>
            <TableCell align="left" className="font-bold">
              Description
            </TableCell>
            <TableCell align="left" className="font-bold" width={180}>
              Default
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>{renderRows(schema.keys)}</TableBody>
      </Table>
    );
  }

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          <TableCell align="left" className="font-bold" width={220}>
            Type
          </TableCell>
          <TableCell align="left" className="font-bold">
            Description
          </TableCell>
          <TableCell align="left" className="font-bold" width={180}>
            Default
          </TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        <SchemaTableRow schema={schema} columnCount={3} />
      </TableBody>
    </Table>
  );
};
