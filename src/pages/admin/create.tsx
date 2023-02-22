import AuthCheck from "@/components/AuthCheck";
import { FileUploader } from "@/components/files/FileUploader";

export default function CreateExhibitPage(_props) {
  return <AuthCheck signedInContent={<CreateFile />}></AuthCheck>;
}

function CreateFile() {
  // const { user, userAdapter } = useContext<UserContext>(UserContext);

  // generate an id to use for the new file
  // const id = doc(collection(db, "files")).id;

  return (
    <div>
      <FileUploader />
    </div>
  );

  // return <div>
  //   <FileUploader id={id} onComplete={async (file: File) => {

  //     // file is now in cloud storage
  //     // create a file record in firestore (triggers cloud function to generate derivatives)
  //     await add(userAdapter!, id, {
  //       uid: user.uid,
  //       type: file.type as MimeType,
  //       title: path.basename(file.name, path.extname(file.name))
  //     });

  //     // redirect to the edit page for the new file
  //     window.location.href = `/admin/${id}`;
  //     //console.log("added file", file);
  //   }} />
  // </div>;
}
