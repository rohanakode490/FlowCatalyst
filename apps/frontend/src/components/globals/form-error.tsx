import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ErrorProps = {
  errorMessage: string;
};

export default function Error(props: ErrorProps) {
  return (
    <Alert variant="destructive" className="mb-4 border-red-200 text-red-300">
      {/* @ts-ignore */}
      <AlertCircle color="#fca5a5" className="h-5 w-5" />
      <AlertTitle className="font-bold">Error</AlertTitle>
      <AlertDescription className="text-sm">
        {props.errorMessage}
      </AlertDescription>
    </Alert>
  );
}
