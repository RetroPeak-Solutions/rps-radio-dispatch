import React, { useEffect, useState } from "react";
import axios from "axios";
import { AuthUser } from "../utils/link";
import { useNavigate, type LoaderFunctionArgs } from "react-router";
import getSessionUser from "../utils/getSessionUser";
import { useLoading } from "../context/Loading";
import { WelcomeMessage } from "../components/UI/WelcomeMessage";

export async function loader({ request }: LoaderFunctionArgs) {
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
  // const plans = await prisma.subscriptionPlan.findMany();


  return { user };
}

export default function Home() {
  const { setLoading } = useLoading();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>();

  useEffect(() => {
    let mounted = true;
    const loadSession = async () => {
      setLoading(true);
      await getSessionUser({
        onSuccess(User: any) {
          setUser(User);
          console.log(`${User?.lastName}`)
        },
        onFailed(data: any) {
          console.log("failed to get Session User:", data?.message);
          navigate('/auth/login');
        }
      });
      setLoading(false);
    };
    void loadSession();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <WelcomeMessage user={{ firstName: user?.firstName!, lastName: user?.lastName! }} />
      <p className="text-center">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Sint dolorem unde beatae odio cupiditate temporibus
        numquam adipisci voluptatum tempora cumque fugit sunt expedita quae blanditiis saepe alias, natus consequatur
        necessitatibus? Lorem ipsum dolor sit amet consectetur adipisicing elit. Sint dolorem unde beatae odio
        cupiditate temporibus numquam adipisci voluptatum tempora cumque fugit sunt expedita quae blanditiis saepe
        alias, natus consequatur necessitatibus?
      </p>
    </div>
  );
}
