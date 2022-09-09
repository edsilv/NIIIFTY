import { db, timestamp } from "@/utils/Firebase";
import {
  collection,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Post } from "@/utils/Types";
import packageJSON from "../../package.json";
import { slugify } from "@/utils/Utils";
import { User } from "firebase/auth";

export class UserAdapter {
  user: User;

  constructor(user: User) {
    this.user = user;
  }

  async addPost(values: Post) {
    const post = {
      ...values,
      created: timestamp(),
      modified: timestamp(),
      softwareVersion: packageJSON.version,
    };

    const id: string = slugify(post.title);
    await setDoc(doc(db, this.getPostPath(id)), post);

    return id;
  }

  async updatePost(id: string, values: Post) {
    await updateDoc(doc(db, this.getPostPath(id)), {
      ...values,
      modified: timestamp(),
      softwareVersion: packageJSON.version,
    });
  }

  async removePost(id: string) {
    await deleteDoc(doc(db, this.getPostPath(id)));
  }

  getPostPublicId() {
    return doc(collection(db, `users/${this.user.uid}/posts/`)).id;
  }

  getPostPath(id: string) {
    return `users/${this.user.uid}/posts/${id}`;
  }
}
