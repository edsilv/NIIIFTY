import { ChangeEvent, useState } from "react";
import { storage } from "../../utils/Firebase";
import { ref, uploadBytesResumable } from "firebase/storage";
import { useTranslation } from "react-i18next";

export default function FileUploader({ id, onComplete }: {
  id: string;
  onComplete: (file: File) => void;
}) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  // const [thumbnailURL, setThumbnailURL] = useState(null);
  // const [thumbnailReady, setThumbnailReady] = useState(false);
  const MAX_FILE_SIZE = 524288000; // 500MB

  // Creates a Firebase Upload Task
  const uploadFile = async (e: ChangeEvent<HTMLInputElement>) => {
    // Get the file
    const file: File = Array.from(e.target.files)[0];

    // check max size (500mb)
    if (file.size > MAX_FILE_SIZE) {
      alert(t("fileTooLarge"));
      return;
    }

    // check file type (not necessary)
    // if (!Object.values(MIMETYPES).includes(file.type)) {
    //   alert(t("fileTypeNotSupported"));
    //   return;
    // }

    const extension = file.type.split("/")[1];
    const fileName: string = `${id}/original.${extension}`;
    const storageRef = ref(storage, fileName);

    setUploading(true);

    // Starts the upload
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        // Observe state change events such as progress, pause, and resume
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        const pct = (
          (snapshot.bytesTransferred / snapshot.totalBytes) *
          100
        ).toFixed(0) as any;

        setProgress(pct);

        switch (snapshot.state) {
          case 'paused':
            // console.log('Upload is paused');
            break;
          case 'running':
            // console.log('Upload is running');
            break;
        }
      },
      (error) => {
        // Handle unsuccessful uploads
        console.error(error);
      },
      () => {
        setUploading(false);
        onComplete(file);
      }
    );
  };

  return (
    <div>
      {
        uploading && <>{t("loading")}</>
      }
      {uploading && <h3>{progress}%</h3>}

      {!uploading && (
        <>
          <label className="bg-gray-400 p-4 block cursor-pointer">
            {t("uploadFile")}
            <input
              type="file"
              onChange={uploadFile}
              className="hidden"
              accept="image/x-png,image/jpeg,image/tif,image/tiff,video/mp4,model/gltf-binary"
            />
          </label>
        </>
      )}
    </div>
  );
}
