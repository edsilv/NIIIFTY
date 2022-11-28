import { db, timestamp } from "@/utils/Firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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

  async addFile(values: Partial<File>) {
    const file = {
      ...values,
      created: timestamp(),
      modified: timestamp(),
      softwareVersion: packageJSON.version,
    };

    const { id } = await addDoc(collection(db, this.getAddFilePath()), file);

    return id;
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

  getFilePath(id: string) {
    return `files/${id}`;
  }
}
