import logo from "@/assets/logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return <img src={logo} alt="ABBAD logo" className={className} draggable={false} />;
}
