import type { NextApiRequest, NextApiResponse } from "next";

// see middleware.ts
export default function handler(_: NextApiRequest, res: NextApiResponse) {
  res.setHeader("WWW-authenticate", 'Basic realm="Secure Area"');
  res.statusCode = 401;
  res.end(`Auth Required.`);
}
