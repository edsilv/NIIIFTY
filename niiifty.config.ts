export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface ItemFormat {
  enabled: boolean;
}

export interface Environment {
  basicAuthDisabled: boolean;
  firebaseConfig: FirebaseConfig;
  recaptchaSiteKey: string;
  site: string;
  theme: "system" | "light" | "dark";
  headerTitle: string;
  title: string;
  description: string;
  maxFileSize: number;
}

export type EnvironmentType = "default" | "staging";

export interface Config {
  environment: EnvironmentType;
  localhost: string;
  environments: { [key in EnvironmentType]: Environment };
}

export default {
  environment: "default",
  localhost: "http://localhost:3000/",
  environments: {
    default: {
      basicAuthDisabled: true,
      recaptchaSiteKey: "6LekWdUhAAAAAOKeHNJ-B1oIL_m-JYyZiqKF7uPV",
      site: "https://niiifty.com",
      headerTitle: "NIIIFTY",
      theme: "system",
      title: "NIIIFTY",
      description:
        "Store large images, 3D models, and audio/video content as IIIF on IPFS.",
      maxFileSize: 209715200, // 150MB
      firebaseConfig: {
        apiKey: "AIzaSyAJXsKK29NijmTKMt9JRPL9ParZqdMSTJo",
        authDomain: "niiifty-tutorial.firebaseapp.com",
        projectId: "niiifty-tutorial",
        storageBucket: "niiifty-tutorial.appspot.com",
        messagingSenderId: "976329845609",
        appId: "1:976329845609:web:f46368a7132136039e6bf8",
        measurementId: "G-1P1WFKL7MM",
      },
    },
  },
} as Config;
