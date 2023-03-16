import AuthCheck from "@/components/AuthCheck";
import { FileUploader } from "@/components/files/FileUploader";

export default function CreateExhibitPage(_props) {
  return <AuthCheck signedInContent={<CreateFile />}></AuthCheck>;
}

function CreateFile() {
  return (
    <div>
      <FileUploader />
    </div>
  );
}
