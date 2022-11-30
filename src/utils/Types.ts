import { UserAdapter } from "@/hooks/UserAdapter";
import { Timestamp } from "firebase/firestore";

// https://lorefnon.tech/2020/02/02/conditionally-making-optional-properties-mandatory-in-typescript/
type MandateProps<T extends {}, K extends keyof T> = Omit<T, K> & {
  [MK in K]-?: NonNullable<T[MK]>;
};

export const MIMETYPES = {
  PNG: "image/png",
  JPG: "image/jpeg",
  MP4: "video/mp4",
  GLB: "model/gltf-binary",
} as const;
// "audio/mpeg" ?

export type MimeType = typeof MIMETYPES[keyof typeof MIMETYPES];

export interface File {
  id?: string;
  created: Timestamp;
  uid: string; // who created it (files are global, not stored in user's collection)
  modified: Timestamp;
  mimetype: MimeType;
}

export type FileProps = {
  username: string | null;
  slug: string | null;
  file: File;
};

// all of these props are required on save
export type SavedFile = MandateProps<
  File,
  | "mimetype"
  | "uid"
>;

// loaded when authoring an file
export interface AuthoringFile extends SavedFile {
  id?: string;
}

// export type FileTuple = [string, File];
// export type PartialFileTuple = [string, Partial<File>];
// export type FileMap = Map<string, File>;

export interface UseDocumentOptions<T> {
  onData?: (data: T) => void;
  onError?: () => void;
}

export type UseDocument<T, O> = (
  userAdapter: UserAdapter,
  id: string,
  options: O
) => [document: T, modifiers: DocumentModifiers<T>];

export type DocumentModifiers<T> = {
  update?: (userAdapter: UserAdapter, id: string, value: T) => void;
};

export interface UseChildCollectionOptions<T> {
  onData?: (collectionItems: Map<string, T>) => void;
  onError?: () => void;
}

export type UseChildCollection<T, Options> = (
  userAdapter: UserAdapter,
  parentid: string,
  options?: Options
) => [collectionItems: Map<string, T>, modifiers: ChildCollectionModifiers<T>];

export type ChildCollectionModifiers<T> = {
  add?: (
    userAdapter: UserAdapter,
    parentid: string,
    value: Partial<T>,
    cb?: (id: string) => void | undefined
  ) => void;
  addAll?: (userAdapter: UserAdapter, parentid: string, values: T[]) => void;
  update?: (
    userAdapter: UserAdapter,
    parentid: string,
    value: [string, Partial<T>],
    cb?: () => void | undefined
  ) => void;
  updateAll?: (
    userAdapter: UserAdapter,
    parentid: string,
    values: [string, Partial<T>][]
  ) => void;
  remove?: (
    userAdapter: UserAdapter,
    parentid: string,
    collectionItemId: string,
    cb?: () => void | undefined
  ) => void;
  removeAll?: (
    userAdapter: UserAdapter,
    parentid: string,
    type: string | null,
    collectionItemIds: string[]
  ) => void;
};
