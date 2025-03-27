import { useEffect, useState } from "react";
import styled from "styled-components";
import { Z_INDEX } from "theme/zIndex";

// Add type extension for Chrome's Performance memory API
interface PerformanceMemory {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

// Extend Performance interface
interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

const Container = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-size: 12px;
  z-index: ${Z_INDEX.fixed};
  display: ${process.env.NODE_ENV === "development" ? "block" : "none"};
`;

/**
 * Component that monitors memory usage in development mode
 * This helps identify memory leaks and high memory usage
 */
export function MemoryMonitor() {
  const [memoryUsage, setMemoryUsage] = useState<{
    used: number;
    limit: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    // Only run in development mode and when performance API is available
    const performance = window.performance as PerformanceWithMemory;
    if (
      process.env.NODE_ENV !== "development" ||
      !performance ||
      !performance.memory
    ) {
      return;
    }

    const checkMemory = () => {
      try {
        const memory = performance.memory;
        if (!memory) return;

        const used = Math.round(memory.usedJSHeapSize / (1024 * 1024));
        const limit = Math.round(memory.jsHeapSizeLimit / (1024 * 1024));
        const percentage = Math.round((used / limit) * 100);

        setMemoryUsage({ used, limit, percentage });

        // Log warning when memory usage is high
        if (percentage > 80) {
          console.warn(
            `High memory usage: ${percentage}% (${used}MB / ${limit}MB)`
          );
        }
      } catch (e) {
        console.error("Error measuring memory usage:", e);
      }
    };

    // Check memory usage every 5 seconds
    const interval = setInterval(checkMemory, 5000);
    checkMemory(); // Check immediately

    return () => clearInterval(interval);
  }, []);

  // Don't render anything if memory usage is not available or in production
  if (!memoryUsage || process.env.NODE_ENV !== "development") {
    return null;
  }

  const { used, limit, percentage } = memoryUsage;
  const color = percentage > 80 ? "red" : percentage > 60 ? "orange" : "green";

  return (
    <Container>
      <div>
        Memory:{" "}
        <span style={{ color }}>
          {used}MB / {limit}MB
        </span>
      </div>
      <div>
        Usage: <span style={{ color }}>{percentage}%</span>
      </div>
    </Container>
  );
}
