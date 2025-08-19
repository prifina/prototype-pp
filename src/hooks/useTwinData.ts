import { useState, useEffect } from "react";
import { coreApi, TwinProfile, SessionData } from "@/services/coreApi";
import { getEnvironmentConfig } from "@/services/environmentConfig";
import { SecurityUtils } from "@/services/securityUtils";
import { useToast } from "@/hooks/use-toast";
import { generateUniqueId } from "@/utils";

export const useTwinData = (twinName: string) => {
  const [profile, setProfile] = useState<TwinProfile | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadTwinData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate twin name
        const { isValid, sanitized } = SecurityUtils.validateTwinName(twinName);
        if (!isValid) {
          setError("Invalid twin name format");
          return;
        }

        console.log("useTwinData Test 1");

        // Load twin profile
        const twinProfile = await coreApi.getTwinProfile(sanitized);
        setProfile(twinProfile);

        console.log("useTwinData Test 2", twinProfile);

        // Initialize session if not auth required
        if (true) {
          const newSessionId = generateUniqueId();
          const sessionData = await coreApi.initSession({
            sessionId: newSessionId,
            knowledgebaseId: twinProfile.knowledgebaseId,
            typeOfExampleQuestions: twinProfile.typeOfExampleQuestions,
            noOfExampleQuestions: twinProfile.noOfExampleQuestions,
            existingExampleQuestions: twinProfile.exampleQuestions
              ? twinProfile.exampleQuestions.length
              : 0,
            showExamples: true,
            debug: false,
            userLanguage: "English",
            stat: {
              name: "default",
              status: false,
              twin: sanitized,
              storage: [
                {
                  name: "default",
                  twin: sanitized,
                },
              ],
              url: `/${sanitized}`,
            },
            twinName: sanitized,
            targetLng: "English",
          });
          setProfile({ ...twinProfile, ...sessionData });

          console.log(
            "useTwinData Test 4",
            sessionData.sessionId === "demo-session-id",
            sessionData.sessionId,
            sessionData
          );
          setSession({
            sessionId: newSessionId,
          });

          // Show demo mode notification if applicable
          if (sessionData.sessionId === "demo-session-id") {
            toast({
              title: "Demo Mode",
              description:
                "Running in demo mode - backend API not available. You can still explore the interface!",
              variant: "default",
            });
          }
        }
        console.log("useTwinData Test 3");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load twin data";
        setError(errorMessage);

        console.error("Error loading twin data:", err);

        // Only show toast for unexpected errors
        if (
          !errorMessage.includes("Invalid twin name") &&
          !errorMessage.includes("Twin not found")
        ) {
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (twinName) {
      loadTwinData();
    }
  }, [twinName, toast]);

  return { profile, session, loading, error };
};
