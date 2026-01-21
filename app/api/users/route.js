import { dbConnect } from '@/lib/mongoose';
import User from '@/models/User';

export async function GET(request) {
  await dbConnect();
  const users = await User.find();
  return Response.json(users);
}

export async function POST(request) {
  await dbConnect();
  const data = await request.json();
  const user = await User.create(data);
  return Response.json(user);
}
