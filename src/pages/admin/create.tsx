import AuthCheck from "@/components/AuthCheck";
import FileUploader from "@/components/files/FileUploader";
import { useContext } from "react";
import { add } from "@/hooks/useFile";
import { UserContext } from "@/utils/UserContext";
import { db } from "@/utils/Firebase";
import { collection, doc } from "firebase/firestore";
import { MimeType } from "@/utils/Types";
import path from "path";

export default function CreateExhibitPage(_props) {
  return <AuthCheck signedInContent={<CreateFile />}></AuthCheck>;
}

function CreateFile() {
  const { user, userAdapter } = useContext<UserContext>(UserContext);

  // generate an id to use for the new file
  const id = doc(collection(db, "files")).id;

  return <div>
    <FileUploader id={id} onComplete={async (file: File) => {

      // file is now in cloud storage
      // create a file record in firestore (triggers cloud function to generate derivatives)
      const fileid = await add(userAdapter!, id, {
        uid: user.uid,
        type: file.type as MimeType,
        title: path.basename(file.name, path.extname(file.name))
      });

      // redirect to the edit page for the new file
      window.location.href = `/admin/${fileid}`;
      //console.log("added file", file);
    }} />
  </div>;
}
