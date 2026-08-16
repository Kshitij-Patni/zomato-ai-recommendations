export default function Footer() {
  return (
    <footer className="w-full border-t border-[#E8E8E8] py-12 bg-white/80 backdrop-blur-md mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-[#828282]">
          <span>🍽️</span>
          <span className="font-[Lexend] text-sm tracking-tight text-[#1C1C1C] font-medium">
            Zomato AI Recommendations
          </span>
        </div>
        <div className="text-[12px] font-semibold tracking-[0.05em] text-[#828282]">
          Dataset by{" "}
          <a
            href="https://huggingface.co/datasets/ManikaSaini/zomato-restaurant-recommendation"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#e23744] transition-colors"
          >
            Hugging Face
          </a>
          {" "}· LLM by Groq
        </div>
      </div>
    </footer>
  );
}
