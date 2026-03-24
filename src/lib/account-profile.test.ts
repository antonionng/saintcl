import { describe, expect, it } from "vitest";

import {
  getAccountAvatarExtension,
  getAccountAvatarPath,
  getAccountProfileMetadata,
  getMetadataDisplayName,
  getPreferredUserDisplayName,
  getUserAvatarInitials,
  mergeAccountProfileMetadata,
  mergeStoredUserProfileSources,
  renderProfileContextForAgent,
} from "./account-profile";

describe("account profile helpers", () => {
  it("prefers the saved profile name over auth metadata and email", () => {
    expect(
      getPreferredUserDisplayName({
        profileDisplayName: "Alex Founder",
        metadataDisplayName: "Alexandra",
        email: "alex@example.com",
      }),
    ).toBe("Alex Founder");
  });

  it("falls back to metadata and email when no saved profile name exists", () => {
    expect(
      getPreferredUserDisplayName({
        profileDisplayName: "",
        metadataDisplayName: "Alexandra",
        email: "alex@example.com",
      }),
    ).toBe("Alexandra");

    expect(
      getPreferredUserDisplayName({
        profileDisplayName: "",
        metadataDisplayName: "",
        email: "alex@example.com",
      }),
    ).toBe("alex@example.com");
  });

  it("extracts a display name from auth metadata", () => {
    expect(
      getMetadataDisplayName({
        user_metadata: {
          full_name: "Alex Founder",
        },
      }),
    ).toBe("Alex Founder");
  });

  it("extracts a display name from the SaintClaw profile metadata fallback", () => {
    expect(
      getMetadataDisplayName({
        user_metadata: {
          saintclaw_profile: {
            display_name: "Antonio",
          },
        },
      }),
    ).toBe("Antonio");
  });

  it("creates user-scoped avatar paths from supported mime types", () => {
    expect(getAccountAvatarExtension("image/png")).toBe("png");
    expect(getAccountAvatarPath("user_123", "image/png")).toBe("user_123/avatar.png");
    expect(getAccountAvatarPath("user_123", "image/avif")).toBeNull();
  });

  it("derives initials from the preferred label", () => {
    expect(getUserAvatarInitials({ displayName: "Alex Founder" })).toBe("AF");
    expect(getUserAvatarInitials({ email: "alex@example.com" })).toBe("AE");
  });

  it("merges account profile metadata without clearing unrelated fields", () => {
    const merged = mergeAccountProfileMetadata(
      {
        saintclaw_profile: {
          display_name: "Alex Founder",
          avatar_path: "user_123/avatar.png",
        },
      },
      {
        what_i_do: "Builds product",
      },
    );

    expect(
      getAccountProfileMetadata({
        user_metadata: merged,
      }),
    ).toEqual({
      display_name: "Alex Founder",
      avatar_path: "user_123/avatar.png",
      what_i_do: "Builds product",
    });
  });

  it("prefers a fallback avatar path when the primary profile is stale", () => {
    expect(
      mergeStoredUserProfileSources(
        {
          displayName: "Alex Founder",
          whatIDo: "",
          agentBrief: "",
          avatarPath: null,
        },
        {
          displayName: "",
          whatIDo: "Builds product",
          agentBrief: "Prefers concise updates",
          avatarPath: "user_123/avatar.png",
        },
      ),
    ).toEqual({
      displayName: "Alex Founder",
      whatIDo: "Builds product",
      agentBrief: "Prefers concise updates",
      avatarPath: "user_123/avatar.png",
    });
  });

  it("keeps populated primary profile fields over fallback metadata", () => {
    expect(
      mergeStoredUserProfileSources(
        {
          displayName: "Alex Founder",
          whatIDo: "Runs product",
          agentBrief: "Wants detailed changelogs",
          avatarPath: "user_123/table.png",
        },
        {
          displayName: "Alex",
          whatIDo: "Builds product",
          agentBrief: "Prefers concise updates",
          avatarPath: "user_123/metadata.png",
        },
      ),
    ).toEqual({
      displayName: "Alex Founder",
      whatIDo: "Runs product",
      agentBrief: "Wants detailed changelogs",
      avatarPath: "user_123/table.png",
    });
  });

  it("renders a compact owner profile block for agents", () => {
    expect(
      renderProfileContextForAgent({
        displayName: "Antonio",
        whatIDo: "Builds AI products",
        agentBrief: "Prefers concise updates",
      }),
    ).toContain("Owner profile:");
  });
});
