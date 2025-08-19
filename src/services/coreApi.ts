import { SecurityUtils } from "./securityUtils";
import { getEnvironmentConfig } from "./environmentConfig";
import { supabase } from "@/integrations/supabase/client";

export interface TwinProfile {
  instructions: string;
  avatar: string;
  qualityClassification: string;
  isSEOVisible: boolean;
  mimeType: string;
  noOfExampleQuestions: number;
  concentrationRatio: number;
  email: string;
  exampleQuestions: string[];
  isMarketingVisible: boolean;
  totalChunks: number;
  ownerId: string;
  thresholdValue: number;
  active: boolean;
  caption: string;
  userId: string;
  isMarketplaceVisible: boolean;
  nullRatio: number;
  showTestimonialForMarketing: boolean;
  created_at: string;
  dailyReport: boolean;
  disclaimerText: string;
  typeOfExampleQuestions: number;
  lastReportTS: number;
  visibilitySocials: object[];
  testimonial: string;
  modified_at: string;
  knowledgebaseId: string;
  description: string;
  title: string;
  "avatar-url": string;
  addBadge: boolean;
  twinStatus: number;
  footer: object;
  hideFooter: boolean;
  authRequired: boolean;
  name: string;
  disclaimerLink: string;
}

export interface SessionData {
  sessionId: string;
}

export interface InitializedSessionData {
  sessionId: string;
  exampleQuestions: string[];
}

export const coreApi = {
  async getTwinProfile(userId: string): Promise<TwinProfile> {
    const { isValid, sanitized } = SecurityUtils.validateTwinName(userId);
    if (!isValid) {
      throw new Error("Invalid twin name");
    }

    const config = getEnvironmentConfig();

    try {
      const { data, error } = await supabase.functions.invoke("core-api", {
        body: {
          action: "getTwinProfile",
          userId: sanitized,
        },
      });

      console.log({ data, error });

      if (error) {
        throw new Error(error.message || "Failed to load twin profile");
      }

      if (data.error) {
        switch (data.status) {
          case 400:
            throw new Error("Twin not found");
          case 401:
            throw new Error("Authentication required");
          case 429:
            throw new Error("Rate limited - please wait before trying again");
          case 504:
            throw new Error("Request timeout");
          default:
            throw new Error("Server error");
        }
      }

      if (!SecurityUtils.validateApiResponse(data)) {
        throw new Error("Invalid response data");
      }

      // Extract profile data from the response
      const profileData = {
        name: data.name || userId,
        description:
          data.instructions ||
          data.description ||
          `Hi! I'm ${userId}'s personal AI twin. How can I help you?`,
        avatar: data.avatar,
        authRequired: false,
        ...data,
      };

      return profileData;
    } catch (error) {
      if (config.isDebug) {
        console.error("Core API error:", error);
      }
      throw error;
    }
  },

  async initSession(params: {
    sessionId: string;
    knowledgebaseId: string;
    typeOfExampleQuestions: number;
    noOfExampleQuestions: number;
    existingExampleQuestions: number;
    showExamples: boolean;
    debug: boolean;
    userLanguage: string;
    stat: object;
    twinName: string;
    targetLng: string;
  }): Promise<InitializedSessionData> {
    const config = getEnvironmentConfig();

    console.log("CORE API INIT TEST 1");

    let headers = { headers: {} };

    try {
      const { data, error } = await supabase.functions.invoke("get-headers");
      if (error) {
        throw new Error(error.message || "Failed to initialize session");
      }

      if (data.error) {
        switch (data.status) {
          default:
            throw new Error("Failed to initialize session");
        }
      }
      headers.headers = data.headers;
    } catch (error) {
      if (config.isDebug) {
        console.error("Session init error:", error);
      }
      throw error;
    }

    try {
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

      const { data, error } = await supabase.functions.invoke("core-api", {
        body: {
          action: "initSession",
          networkId: envData.objOfEnvs.NEXT_PUBLIC_NETWORK_ID,
          appId: envData.objOfEnvs.NEXT_PUBLIC_APP_ID,
          ...params,
          stat: {
            ...params.stat,
            headers,
          },
        },
      });
      console.log("CORE API INIT TEST 2", data, error);

      if (error) {
        throw new Error(error.message || "Failed to initialize session");
      }

      if (data.error) {
        switch (data.status) {
          case 400:
            throw new Error("Invalid session parameters");
          case 401:
            throw new Error("Authentication failed");
          case 429:
            throw new Error("Rate limited");
          case 504:
            throw new Error("Session initialization timeout");
          default:
            throw new Error("Failed to initialize session");
        }
      }

      if (!SecurityUtils.validateApiResponse(data)) {
        throw new Error("Invalid session data");
      }

      return data;
    } catch (error) {
      if (config.isDebug) {
        console.error("Session init error:", error);
      }
      throw error;
    }
  },
};
