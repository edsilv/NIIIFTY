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
import {
  DocumentModifiers,
  Post,
  UseDocument,
  UseDocumentOptions,
} from "@/utils/Types";
import { UserAdapter } from "./UserAdapter";

export const add = async (userAdapter: UserAdapter, values: Post) => {
  const id = await userAdapter.addPost(values);
  return id;
};

const modifiers: DocumentModifiers<Post> = {
  update: (userAdapter: UserAdapter, id: string, values: Post) => {
    userAdapter.updatePost(id, values);
  },
};

export const remove = async (userAdapter: UserAdapter, id: string) => {
  return userAdapter.removePost(id);
};

export interface UsePostOptions extends UseDocumentOptions<Post> {
  // extend with any other options
}

export const postConverter: FirestoreDataConverter<Post> = {
  toFirestore(item: WithFieldValue<Post>): DocumentData {
    return item;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Post {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
    } as Post;
  },
};

export const usePost: UseDocument<Post, UsePostOptions> = (
  userAdapter: UserAdapter,
  id: string,
  options: UsePostOptions = {}
): [post: Post, modifiers: DocumentModifiers<Post>] => {
  const [post, setPost] = useState<Post>();

  const q = doc(db, userAdapter.getPostPath(id)).withConverter(postConverter);

  const [data, loading] = useDocumentData(q);

  useEffect(() => {
    if (!loading && data) {
      setPost(data);
    }
  }, [loading, data]);

  return [post, modifiers];
};
