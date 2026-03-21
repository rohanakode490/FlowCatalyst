import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ErrorProps = {
  errorMessage: string;
  className?: string;
};

export default function Error(props: ErrorProps) {
  return (
    <Alert
      variant="destructive"
      className={`mb-4 border-destructive/20 bg-destructive/10 text-destructive ${props.className}`}
    >
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="font-bold">Error</AlertTitle>
      <AlertDescription className="text-sm">
        {props.errorMessage}
      </AlertDescription>
    </Alert>
  );
}
