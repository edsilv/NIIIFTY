import cx from "classnames";
import { useEffect, useRef, useState } from "react";
import { auth, storage } from "../utils/Firebase";
import { ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { useTranslation } from "react-i18next";

function getThumbnailURL(imageURL: string) {
  const regex = /images%2F.*%2F/i;
  const imagesPath = regex.exec(imageURL)[0];
  return imageURL.replace(imagesPath, imagesPath + "thumb_");
}

// Uploads images to Firebase Storage
export default function ImageUploader({ onComplete }) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageURL, setImageURL] = useState(null);
  const [thumbnailURL, setThumbnailURL] = useState(null);
  const [thumbnailReady, setThumbnailReady] = useState(false);

  // Creates a Firebase Upload Task
  const uploadFile = async (e) => {
    // Get the file
    const file = Array.from(e.target.files)[0] as any;
    const extension = file.type.split("/")[1];

    // Makes reference to the storage bucket location
    const storageRef = ref(storage,
      `images/${auth.currentUser.uid}/${Date.now()}.${extension}`
    );

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
            console.log('Upload is paused');
            break;
          case 'running':
            console.log('Upload is running');
            break;
        }
      },
      (error) => {
        // Handle unsuccessful uploads
        console.error(error);
      },
      () => {
        // Handle successful uploads on complete
        // For instance, get the download URL: https://firebasestorage.googleapis.com/...
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          const thumbnailURL = getThumbnailURL(downloadURL);
          setImageURL(imageURL);
          setThumbnailURL(thumbnailURL);
          setUploading(false);
          onComplete({
            imageURL,
            thumbnailURL,
          });
        })
      }
    );
  };

  const thumbRef = useRef();

  useEffect(() => {
    // when the thumbnailURL is set, keep trying to load the image until it succeeds

    if (thumbRef.current) {
      const timestamp = Date.now();

      // @ts-ignore
      thumbRef.current.onerror = () => {
        if (Date.now() - timestamp < 10000) {
          setTimeout(() => {
            // @ts-ignore
            thumbRef.current.src = thumbnailURL;
          }, 1000);
        }
      };
      // @ts-ignore
      thumbRef.current.onload = () => {
        setThumbnailReady(true);
      }
      // @ts-ignore
      thumbRef.current.src = thumbnailURL;
    }
  }, [thumbnailURL]);

  return (
    <div>
      {
        uploading && <>{t("loading")}</>
      }
      {uploading && <h3>{progress}%</h3>}

      {!uploading && !imageURL && (
        <>
          <label className="bg-gray-400 p-4 block cursor-pointer">
            📸 Upload Image
            <input
              type="file"
              onChange={uploadFile}
              className="hidden"
              accept="image/x-png,image/gif,image/jpeg"
            />
          </label>
        </>
      )}

      {/* {downloadURL && <CodeBlock code={`![alt](${downloadURL})`}></CodeBlock>} */}

      {thumbnailURL && !thumbnailReady && <>{t("loading")}</>}

      {thumbnailURL && <img ref={thumbRef} className={cx({
        "hidden": !thumbnailReady
      })} />}
    </div>
  );
}
