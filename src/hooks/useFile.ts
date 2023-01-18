import { useEffect, useState } from "react";
import { db } from "@/utils/Firebase";
import {
  doc,
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  WithFieldValue,
} from "firebase/firestore";
import { useDocumentData } from "react-firebase-hooks/firestore";
import { migrateFile } from "@/utils/Migration";
import {
  AuthoringFile,
  DocumentModifiers,
  File,
  UseDocument,
  UseDocumentOptions,
} from "@/utils/Types";
import { UserAdapter } from "./UserAdapter";

export const add = async (
  userAdapter: UserAdapter,
  id: string,
  values: Partial<File>,
) => {
  return await userAdapter.addFile(id, values);
};

const modifiers: DocumentModifiers<AuthoringFile> = {
  update: (userAdapter: UserAdapter, id: string, values: AuthoringFile) => {
    return userAdapter.updateFile(id, values);
  },
};

export const remove = async (userAdapter: UserAdapter, id: string) => {
  return userAdapter.removeFile(id);
};

export interface UseFileOptions
  extends UseDocumentOptions<AuthoringFile> {
  // extend with any other options
};

export const fileConverter: FirestoreDataConverter<AuthoringFile> = {
  toFirestore(item: WithFieldValue<AuthoringFile>): DocumentData {
    return item;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): AuthoringFile {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
    } as AuthoringFile;
  },
};

export const useAuthoringFile: UseDocument<
  AuthoringFile,
  UseFileOptions
> = (
  userAdapter: UserAdapter,
  id: string,
  options: UseFileOptions = {}
): [
      file: AuthoringFile,
      modifiers: DocumentModifiers<AuthoringFile>
    ] => {
    let { onData, onError } = options;

    const [file, setFile] = useState<AuthoringFile>();

    // const q = doc(db, "files", id).withConverter(fileConverter);
    const q = doc(db, userAdapter.getFilePath(id)).withConverter(
      fileConverter
    );

    const [data, loading] = useDocumentData(q);

    useEffect(() => {
      if (!loading) {
        if (data) {
          // ensure old db values are migrated to new schema
          // annotations and items are already migrated in useAnnotations and useItems
          const migratedFile = migrateFile({
            ...data,
          });

          setFile(migratedFile as any);

          if (onData) {
            onData(migratedFile as any);
          }
        } else if (!data && onError) {
          onError();
        }
      }

      return () => {
        onData = undefined;
        onError = undefined;
      };

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, loading]);

    return [file as AuthoringFile, modifiers];
  };
