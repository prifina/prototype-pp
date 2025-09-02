import { SecurityUtils } from "./securityUtils";
import { getEnvironmentConfig } from "./environmentConfig";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { generateUniqueId, getStreamAnswer } from "@/utils";

export interface StreamMessage {
  text: string;
  finish_reason: string | null;
}

export const middlewareApi = {
  async streamGenerate(params: {
    knowledgebaseId: string;
    userId: string;
    statement: string;
    stream?: boolean;
    model?: string;
    scoreLimit?: number;
    index: number;
    stopLoading: Function;
    sessionId: string;
  }): Promise<Array<{ answer: string; finish_reason: string }>> {
    console.log("STREAM GENERATE");
    const { isValid, sanitized, error } = SecurityUtils.validateChatMessage(
      params.statement
    );
    if (!isValid) {
      throw new Error(error || "Invalid message");
    }

    const config = getEnvironmentConfig();

    try {
      const now = new Date();
      const january = new Date(now.getFullYear(), 0, 1);
      const dst = now.getTimezoneOffset() < january.getTimezoneOffset();

      //console.log("Is DST Currently Active?", isCurrentlyInDST());
      const offsetMinutes = now.getTimezoneOffset();
      const hours = Math.floor(Math.abs(offsetMinutes) / 60);
      const minutes = Math.abs(offsetMinutes) % 60;
      const sign = offsetMinutes > 0 ? "-" : "+";

      const gmtOffset = `GMT${sign}${hours
        .toString()
        .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

      const { data: envData, error: envError } =
        await supabase.functions.invoke("get-env-var", {
          body: {
            name: ["NEXT_PUBLIC_NETWORK_ID", "NEXT_PUBLIC_APP_ID"],
          },
        });

      if (envError) {
        throw new Error(envError.message || "Failed to load twin profile");
      }

      if (envData.error) {
        switch (envData.status) {
          case 429:
            throw new Error("Rate limited - please wait before trying again");
          case 401:
            throw new Error("Authentication failed");
          case 400:
            throw new Error("Invalid request parameters");
          case 504:
            throw new Error("Request timeout");
          default:
            throw new Error("Server error");
        }
      }

      const payload = {
        statement: sanitized,
        knowledgebaseId: "3b5e8136-2945-4cb9-b611-fff01f9708e8",
        scoreLimit: 0.5,
        userId: "production-physiotherapy",
        requestId: uuidv4(),
        debug: false,
        userLanguage: "English",
        stream: true,
        msgIdx: 0,
        sessionId: params.sessionId,
        networkId: "x_prifina",
        appId: "speak-to",
        localize: {
          locale: "en-US",
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          offset: offsetMinutes,
          currentTime: now.toISOString(),
          dst,
          gmtOffset,
        },
        options: {},
        environment: "prod"
      };

      console.log("service/middleware", { params });
        const { data: data2, error } = await supabase.functions.invoke(
        "middleware-api",
        { 
          body: {
            endpoint: "v2/generate",
            method: "POST",
            body: payload
          }
        }
      );

      if (error) {
        throw new Error(error.message || "Failed to load twin profile");
      }

      if (data2.error) {
        switch (data2.status) {
          case 429:
            throw new Error("Rate limited - please wait before trying again");
          case 401:
            throw new Error("Authentication failed");
          case 400:
            throw new Error("Invalid request parameters");
          case 504:
            throw new Error("Request timeout");
          default:
            throw new Error("Server error");
        }
      }

      params.stopLoading();

      const streamResults = getStreamAnswer(data2.body, "chat-" + params.index);

      const results = await Promise.all([streamResults]);
      return results;
    } catch (error) {
      if (config.isDebug) {
        console.error("Middleware API error:", error);
      }
      throw error;
    }
  },
};
