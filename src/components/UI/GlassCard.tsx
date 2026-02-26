export default function GlassCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-[#3C83F6] via-purple-500 to-pink-500">
      <div className="bg-[#111827]/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl min-h-fit">
        <h2 className="text-xl font-bold mb-4 text-white">{title}</h2>
        <div className="space-y-4 min-h-fit">{children}</div>
      </div>
    </div>
  );
}