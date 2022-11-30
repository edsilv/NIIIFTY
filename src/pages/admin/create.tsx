import AuthCheck from "@/components/AuthCheck";
import FileUploader from "@/components/FileUploader";
import { useContext, useState } from "react";
import { add } from "@/hooks/useFile";
import { UserContext } from "@/utils/UserContext";
import { db } from "@/utils/Firebase";
import { collection, doc } from "firebase/firestore";

export default function CreateExhibitPage(_props) {
  return <AuthCheck signedInContent={<CreateFile />}></AuthCheck>;
}

function CreateFile() {
  const { user, userAdapter } = useContext<UserContext>(UserContext);

  // generate an id to use for the new file
  const id = doc(collection(db, "files")).id;

  return <div>
    <FileUploader id={id} onComplete={async () => {

      // create file in firestore
      const fileid = await add(userAdapter!, id, {
        uid: user.uid,
      });

      console.log("added file", fileid);
    }} />
  </div>;
}
