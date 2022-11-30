import { db, timestamp } from "@/utils/Firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { File } from "@/utils/Types";
import packageJSON from "../../package.json";
import { User } from "firebase/auth";

export class UserAdapter {
  user: User;

  constructor(user: User) {
    this.user = user;
  }

  async addFile(id: string, values: Partial<File>) {
    const file = {
      ...values,
      created: timestamp(),
      modified: timestamp(),
      softwareVersion: packageJSON.version,
    };

    const docRef = doc(collection(db, this.getAddFilePath()), id);
    return await setDoc(docRef, file);
  }

  async updateFile(id: string, values: Partial<File>) {
    await updateDoc(doc(db, this.getFilePath(id)), {
      ...values,
      modified: timestamp(),
      softwareVersion: packageJSON.version,
    });
  }

  async removeFile(id: string) {
    await deleteDoc(doc(db, this.getFilePath(id)));
  }

  getAddFilePath() {
    return "files";
  }

  // getAddFilePath(id: string) {
  //   return `files/${id}`;
  // }

  getFilePath(id: string) {
    return `files/${id}`;
  }
}
