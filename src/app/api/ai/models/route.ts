import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Fetch AI model assignments for events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const modelId = searchParams.get("modelId") || "ideaflow-coach";

    const where: Record<string, string> = {};
    if (eventId) {
      where.eventId = eventId;
    }

    const settings = await prisma.eventSetting.findMany({
      where: {
        ...where,
        key: {
          startsWith: `ai_model_${modelId}`,
        },
      },
    });

    const assignments = settings.map((s) => ({
      eventId: s.eventId,
      key: s.key,
      ...JSON.parse(s.value),
    }));

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Failed to fetch AI model assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

// POST - Link/Unlink AI model to event phase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, phaseId, modelId, enabled } = body;

    if (!eventId || !phaseId || !modelId) {
      return NextResponse.json(
        { error: "eventId, phaseId, and modelId are required" },
        { status: 400 }
      );
    }

    const key = `ai_model_${modelId}_phase_${phaseId}`;
    const value = JSON.stringify({
      enabled: enabled !== false,
      modelId,
      phaseId,
      updatedAt: new Date().toISOString(),
    });

    if (enabled === false) {
      // Remove the assignment
      await prisma.eventSetting.deleteMany({
        where: { eventId, key },
      });

      return NextResponse.json({ success: true, action: "removed" });
    }

    // Create or update the assignment
    await prisma.eventSetting.upsert({
      where: {
        eventId_key: { eventId, key },
      },
      update: { value },
      create: { eventId, key, value },
    });

    return NextResponse.json({ success: true, action: "linked" });
  } catch (error) {
    console.error("Failed to update AI model assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 }
    );
  }
}
