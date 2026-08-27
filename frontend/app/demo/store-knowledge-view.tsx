import * as m from "@/paraglide/messages";
import type { StoreKnowledge } from "@/lib/knowledge";

export function StoreKnowledgeView({ knowledge }: { knowledge: StoreKnowledge[] }) {
  if (knowledge.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-500">{m.demo_knowledge_empty()}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {knowledge.map((item) => (
        <div key={item.id} className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
              {item.knowledge_type}
            </span>
            <h3 className="font-medium text-gray-900">{item.title}</h3>
          </div>
          
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.content}</p>
          
          {item.keywords && item.keywords.length > 0 && (
            <div className="mt-2 border-t border-gray-100 pt-3">
              <p className="mb-2 text-xs font-medium text-gray-500">{m.demo_knowledge_keywords()}</p>
              <div className="flex flex-wrap gap-2">
                {item.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
