"use client";

import Link from "next/link";
import {
  Bot,
  Sparkles,
  Settings,
  MessageSquare,
  Lightbulb,
  ArrowLeft,
  CheckCircle2,
  Clock,
} from "lucide-react";
import TopBar from "@/components/layout/TopBar";

interface AIModel {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  icon: React.ElementType;
  status: "active" | "coming_soon";
  href: string;
  chatHref: string;
  features: string[];
}

const AI_MODELS: AIModel[] = [
  {
    id: "ideaflow-coach",
    name: "IdeaFlow Coach",
    nameAr: "مدرب IdeaFlow",
    description:
      "مدرب إبداعي يوجه المستخدم عبر عملية منظمة لتوليد الأفكار: من تحديد المشكلة، إلى توليد الأفكار، تصنيفها، اختيار الأفضل، وتصميم اختبار عملي.",
    icon: Lightbulb,
    status: "active",
    href: "/ai-models/ideaflow-coach",
    chatHref: "/ai-models/ideaflow-coach/chat",
    features: [
      "توليد الأفكار بكميات كبيرة",
      "تصنيف الأفكار في مجموعات",
      "تحليل أنماط التفكير",
      "تصميم MVP سريع",
    ],
  },
];

export default function AIModelsPage() {
  return (
    <>
      <TopBar title="AI Models" titleAr="نماذج الذكاء الاصطناعي" />
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl gradient-purple flex items-center justify-center shadow-brand">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                نماذج الذكاء الاصطناعي
              </h1>
              <p className="text-sm text-gray-500">
                إدارة وتفعيل نماذج الذكاء الاصطناعي المتاحة للفعاليات
              </p>
            </div>
          </div>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {AI_MODELS.map((model) => (
            <div
              key={model.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-soft-sm hover:shadow-soft-md transition-all overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center">
                      <model.icon className="w-6 h-6 text-brand-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {model.name}
                      </h3>
                      <p className="text-xs text-gray-400">{model.nameAr}</p>
                    </div>
                  </div>
                  {model.status === "active" ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      مفعل
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-400 text-xs font-medium rounded-full">
                      <Clock className="w-3.5 h-3.5" />
                      قريباً
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {model.description}
                </p>
              </div>

              {/* Features */}
              <div className="px-6 py-4 bg-gray-50/50">
                <div className="flex flex-wrap gap-2">
                  {model.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-100 rounded-lg text-[11px] text-gray-500"
                    >
                      <Sparkles className="w-3 h-3 text-brand-400" />
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 flex items-center gap-3 border-t border-gray-50">
                {model.status === "active" ? (
                  <>
                    <Link
                      href={model.chatHref}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      تجربة الشات
                    </Link>
                    <Link
                      href={model.href}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-medium rounded-xl transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      الإعدادات
                    </Link>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-400 text-sm font-medium rounded-xl cursor-not-allowed">
                    <ArrowLeft className="w-4 h-4" />
                    سيتوفر قريباً
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
