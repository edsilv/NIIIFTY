import { UserAdapter } from "@/hooks/UserAdapter";
import { Timestamp } from "firebase/firestore";

export interface Post {
  id?: string;
  created: Timestamp;
  modified: Timestamp;
  title: string;
  description: string;
}

export type PostProps = {
  username: string | null;
  slug: string | null;
  post: Post;
};

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
