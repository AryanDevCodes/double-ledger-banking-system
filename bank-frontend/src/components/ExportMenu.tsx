import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ExportFormat = "csv" | "excel" | "pdf";

interface ExportMenuProps {
  onExport: (format: ExportFormat) => void;
  disabled?: boolean;
  label?: string;
}

export default function ExportMenu({ onExport, disabled, label = "Export" }: ExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Download className="h-4 w-4 mr-2" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport("csv")}>
          <FileText className="h-4 w-4 mr-2" /> Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport("excel")}>
          <FileSpreadsheet className="h-4 w-4 mr-2" /> Export as Excel
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onExport("pdf")}>
          <FileText className="h-4 w-4 mr-2" /> Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
