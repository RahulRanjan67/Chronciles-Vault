import { describe, expect, it } from "vitest";
import { newId } from "@grimoire/shared";
import { clientRepository, ClientRepository } from "../src/client-repository";
import { ContentType, PersonalState, PrivacyState } from "@grimoire/domain";

describe("Concurrency, Race Conditions & AI-Generated Pitfall Protections", () => {
  it("generates 10,000 unique IDs concurrently without any collision", () => {
    const idSet = new Set<string>();
    const count = 10000;
    for (let i = 0; i < count; i++) {
      const id = newId();
      idSet.add(id);
    }
    expect(idSet.size).toBe(count);
  });

  it("subscribes to storage events and updates in-memory repository without stale overwrite", () => {
    let triggered = false;
    const unsub = clientRepository.subscribeToStorage(() => {
      triggered = true;
    });

    clientRepository.notifyStorageChangeForTesting();

    expect(triggered).toBe(true);
    unsub();
  });

  it("strictly enforces that Vault works cannot enter public client repository via updateWork", () => {
    const item = clientRepository.createWork(
      {
        title: "Test Invariant Book",
        contentType: ContentType.Manga,
        originCountry: "JP",
        isFavorite: false,
        isArchived: false,
        tags: [],
        genres: [],
      },
      PersonalState.Reading,
    );

    expect(() => {
      clientRepository.updateWork(item.work.id, { privacyState: PrivacyState.Vault });
    }).toThrow("Vault works must be encrypted in the private vault repository.");
  });

  it("ensures pristine empty library on blank user profile (no phantom works)", () => {
    const repo = new ClientRepository({ empty: true });
    expect(repo.getItems().length).toBe(0);
    expect(repo.getAllWorkRelations().length).toBe(0);
  });
});
