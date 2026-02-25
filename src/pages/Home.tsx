import React from "react";
import axios from "axios";
import link, { AuthUser } from "../utils/link";
import GeneralPageWrapper from "../Wrappers/Page/GeneralWrapper";

export async function loader({ request }: { request: Request }) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/sessionToken=([a-f0-9]{64})/);
  if (!match) throw new Response("Unauthorized", { status: 401 });


  console.log(AuthUser());

  // const sessionRes = await axios.get(`${AuthUser()}`);
  const sessionRes = await axios.get(AuthUser(), {
    withCredentials: true,
  });

  const user = sessionRes.data.user;

  if (!user) throw new Response("Unauthorized", { status: 401 });

  const communities: any[] = [];
  // const plans = await prisma.subscriptionPlan.findMany();


  return { user, communities };
}

export default function Home() {
  return (
    <GeneralPageWrapper>
      <div>
        <h1 className="text-center text-2xl font-bold my-5">Home Page</h1>
        <p className="text-center">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Sint dolorem unde beatae odio cupiditate temporibus
          numquam adipisci voluptatum tempora cumque fugit sunt expedita quae blanditiis saepe alias, natus consequatur
          necessitatibus? Lorem ipsum dolor sit amet consectetur adipisicing elit. Sint dolorem unde beatae odio
          cupiditate temporibus numquam adipisci voluptatum tempora cumque fugit sunt expedita quae blanditiis saepe
          alias, natus consequatur necessitatibus?
        </p>
      </div>
    </GeneralPageWrapper>
  );
}
