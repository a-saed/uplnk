import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { uplnk } from "./index";

describe("uplnk", () => {
  const originalXHR = globalThis.XMLHttpRequest;

  beforeEach(() => {
    // Minimal XHR mock: abort immediately so the request never completes
    class MockXHR {
      open = vi.fn();
      send = vi.fn();
      setRequestHeader = vi.fn();
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      get withCredentials() {
        return false;
      }
      set withCredentials(_: boolean) {}
      get status() {
        return 0;
      }
      get responseText() {
        return "";
      }
      abort = vi.fn();
      upload = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    }
    vi.stubGlobal("XMLHttpRequest", MockXHR);
  });

  afterEach(() => {
    vi.stubGlobal("XMLHttpRequest", originalXHR);
  });

  it("exports uplnk as a function", () => {
    expect(typeof uplnk).toBe("function");
  });

  it("rejects when url is missing", async () => {
    const file = new Blob(["test"]);
    await expect(
      uplnk({
        url: "",
        file,
      }),
    ).rejects.toThrow("url is required");
  });

  it("rejects with abort when signal is aborted", async () => {
    const file = new Blob(["x"]);
    const controller = new AbortController();

    const p = uplnk({
      url: "https://example.com/upload",
      file,
      signal: controller.signal,
    });
    controller.abort();

    await expect(p).rejects.toMatchObject({ type: "abort" });
  });
});
