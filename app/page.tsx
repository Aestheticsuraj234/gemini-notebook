import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import Image from "next/image";

export default function Home() {
  return (
   <div>
    <ModeToggle/>
    <h1>Hello World</h1>
    <Button>Click me</Button>
   </div>
  );
}
