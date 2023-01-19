import React, { ChangeEvent, useContext, useEffect, useState } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import cx from "classnames";
import { formatBytes } from '@/utils/Utils';
import { useTranslation } from 'react-i18next';
import { db, storage } from "../../utils/Firebase";
import { ref, uploadBytesResumable } from "firebase/storage";
import { add } from "@/hooks/useFile";
import { UserContext } from '@/utils/UserContext';
import { collection, doc } from "firebase/firestore";
import { MimeType } from "@/utils/Types";
import path from 'path';

type FileExtended = FileWithPath & { preview: string; error: boolean; };

export function FileUploader2(props) {

  const [files, setFiles] = useState<FileExtended[]>([]);

  const acceptedFileTypes = [
    'audio/mpeg',
    'image/jpeg',
    'image/png',
    'image/tif',
    'image/tiff',
    'image/x-png',
    'model/gltf-binary',
    'video/mp4',
  ];

  function isFileAccepted(file: FileWithPath) {
    return acceptedFileTypes.includes(file.type.toLowerCase()) || file.path.split(".").pop() === "glb";
  }

  function isPreviewSupported(file: FileWithPath) {
    return file.type.startsWith("image/") && !file.type.includes("tiff");
  }

  const {
    // acceptedFiles,
    // fileRejections,
    getRootProps,
    getInputProps,
    isFocused,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    // can't use this because model/gltf-binary file type is not supported by browsers
    // https://github.com/react-dropzone/react-dropzone/issues/962
    // validate inside onDrop instead
    // accept: {
    //   'audio/mpeg': [],
    //   'image/jpeg': [],
    //   'image/png': [],
    //   'image/tif': [],
    //   'image/tiff': [],
    //   'image/x-png': [],
    //   'model/gltf-binary': [],
    //   'video/mp4': [],
    // },
    maxFiles: 10,
    maxSize: 524288000, // 500MB
    multiple: true,
    onDrop: files => {

      let validatedeFiles: FileExtended[] = [];

      files.forEach((file: FileWithPath) => {
        // is file type supported?
        if (isFileAccepted(file)) {
          // only shows preview for images - looks odd alongside other icons
          // if (isPreviewSupported(file)) {
          //   Object.assign(file, {
          //     preview: URL.createObjectURL(file)
          //   });
          // }
        } else {
          (file as FileExtended).error = true;
        }

        validatedeFiles.push(file as FileExtended);
      });

      setFiles(validatedeFiles);
    }
  });

  const AudioIcon = () => {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
      <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
    </svg>;
  };

  const CubeIcon = () => {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.378 1.602a.75.75 0 00-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03zM21.75 7.93l-9 5.25v9l8.628-5.032a.75.75 0 00.372-.648V7.93zM11.25 22.18v-9l-9-5.25v8.57a.75.75 0 00.372.648l8.628 5.033z" />
    </svg>;
  };

  const ImageIcon = () => {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
    </svg>;
  };

  const VideoIcon = () => {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
    </svg>;
  };

  const ErrorIcon = () => {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>;
  };

  const Thumbnail = ({ file }: {
    file: FileExtended;
  }) => {

    if (file.error) {
      return <ErrorIcon />;
    }

    // preview thumbnails are available for images
    if (file.preview) {
      return <img src={file.preview} className="w-16 h-16" />;
    }

    if (!file.type && file.path.split(".").pop() === "glb") {
      return <CubeIcon />;
    }

    if (file.type.startsWith("image/")) {
      return <ImageIcon />;
    }

    if (file.type.startsWith("audio/")) {
      return <AudioIcon />;
    }

    if (file.type.startsWith("video/")) {
      return <VideoIcon />;
    }

    // model/gltf-binary mime type not supported by browsers yet
    // if (file.type.startsWith("model/")) {
    //   return <CubeIcon />;
    // }
  };

  const FileItems = () => {
    return <>
      {
        files.map((file: FileExtended) => (
          <tr key={file.path}>
            <td className={cx(
              "w-16 h-16 pr-4",
              file.error ? "text-red-500" : "text-gray-400"
            )}>
              <Thumbnail file={file} />
            </td>
            <td>
              <span className="font-bold">{file.path}</span><br />
              {formatBytes(file.size, 1)}
            </td>
            <td>
              {
                !file.error && (
                  <FileUpload file={file} />
                )
              }
            </td>
          </tr>
        ))
      }
    </>;
  };

  // return (
  //   <li key={file.path}>
  //     {file.path}, {file.type} - {file.size} bytes
  //     <ul>
  //       {errors.map(e => (
  //         <li key={e.code}>{e.message}</li>
  //       ))}
  //     </ul>
  //   </li>
  // );

  return (
    // <section className={cx(
    //   "bg-gray-200",
    //   isFocused ? "bg-gray-300" : "",
    //   isDragAccept ? "bg-green-300" : "",
    //   isDragReject ? "bg-red-300" : ""
    // )}>
    <section>
      <div {...getRootProps({ className: "flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none" })}>
        <span className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="font-medium text-gray-600">
            Drap &amp; Drop your files or&nbsp;
            <span className="text-blue-600 underline">browse</span>
          </span>
        </span>
        <input {...getInputProps()} />
      </div>
      {
        (files.length > 0) && (
          <table className="min-w-full mt-4">
            <thead>
              <tr>
                <th
                  scope="col"
                >
                </th>
                <th
                  scope="col"
                >
                </th>
                <th
                  scope="col"
                >
                </th>
              </tr>
            </thead>
            <tbody>
              <FileItems />
            </tbody>
          </table>
        )
      }
    </section>
  );
};

const FileUpload = ({ file }: {
  file: FileExtended;
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user, userAdapter } = useContext<UserContext>(UserContext);

  const id = doc(collection(db, "files")).id;

  // Creates a Firebase Upload Task

  useEffect(() => {
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
      async () => {
        setUploading(false);
        // onComplete(file);
        // file is now in cloud storage
        // create a file record in firestore (triggers cloud function to generate derivatives)
        await add(userAdapter!, id, {
          uid: user.uid,
          type: file.type as MimeType,
          title: path.basename(file.name, path.extname(file.name))
        });
      }
    );
  }, []);

  return (
    <div>
      {uploading && <h3>{progress}%</h3>}
    </div>
  );
};