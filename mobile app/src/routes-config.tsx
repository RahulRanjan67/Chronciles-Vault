/**
 * Route configuration and lazy-loaded components.
 * Lives in its own module so App.tsx exports only the App component
 * and Vite Fast Refresh can work correctly.
 */
import * as React from "react";
import { Library } from "./routes/Library";
import type { RouteDefinition } from "./router";

// Lazy-load all routes except Library (the workspace landing page)
const CommandPalette = React.lazy(() =>
  import("./components/features/CommandPalette/CommandPalette").then((module) => ({
    default: module.CommandPalette,
  })),
);
const ReturnDesk = React.lazy(() =>
  import("./routes/ReturnDesk").then((module) => ({ default: module.ReturnDesk })),
);
const WorkDetail = React.lazy(() =>
  import("./routes/WorkDetail").then((module) => ({ default: module.WorkDetail })),
);
const Radar = React.lazy(() =>
  import("./routes/Radar").then((module) => ({ default: module.Radar })),
);
const Updates = React.lazy(() =>
  import("./routes/Updates").then((module) => ({ default: module.Updates })),
);
const FileReader = React.lazy(() =>
  import("./routes/FileReader").then((module) => ({ default: module.FileReader })),
);
const LocalShelf = React.lazy(() =>
  import("./routes/LocalShelf").then((module) => ({ default: module.LocalShelf })),
);
const Memory = React.lazy(() =>
  import("./routes/Memory").then((module) => ({ default: module.Memory })),
);
const Lists = React.lazy(() =>
  import("./routes/Lists").then((module) => ({ default: module.Lists })),
);
const Categories = React.lazy(() =>
  import("./routes/Categories").then((module) => ({ default: module.Categories })),
);
const Discover = React.lazy(() =>
  import("./routes/Discover").then((module) => ({ default: module.Discover })),
);
const Vault = React.lazy(() =>
  import("./routes/Vault").then((module) => ({ default: module.Vault })),
);
const Archive = React.lazy(() =>
  import("./routes/Archive").then((module) => ({ default: module.Archive })),
);
const Settings = React.lazy(() =>
  import("./routes/Settings").then((module) => ({ default: module.Settings })),
);
const Help = React.lazy(() =>
  import("./routes/Help").then((module) => ({ default: module.Help })),
);
const FeaturesGuide = React.lazy(() =>
  import("./routes/FeaturesGuide").then((module) => ({ default: module.FeaturesGuide })),
);

export { CommandPalette };

export const APP_ROUTES: RouteDefinition[] = [
  { path: "/", name: "Library", tier: 0, component: Library },
  { path: "/library", name: "Library", tier: 0, component: Library },
  { path: "/return-desk", name: "Return Desk", tier: 0, component: ReturnDesk },
  { path: "/return", name: "Return Desk", tier: 0, component: ReturnDesk },
  { path: "/work/:id", name: "Work Detail", tier: 1, component: WorkDetail },
  { path: "/library/:id", name: "Work Detail", tier: 1, component: WorkDetail },
  { path: "/radar", name: "Radar", tier: 1, component: Radar },
  { path: "/updates", name: "Updates", tier: 1, component: Updates },
  { path: "/reader/:fileId", name: "Local Reader", tier: 1, component: FileReader },
  { path: "/shelf", name: "Local Shelf", tier: 2, component: LocalShelf },
  { path: "/memory", name: "Memory", tier: 2, component: Memory },
  { path: "/lists", name: "Lists", tier: 2, component: Lists },
  { path: "/categories", name: "My Categories", tier: 2, component: Categories },
  { path: "/discover", name: "Discover", tier: 2, component: Discover },
  { path: "/vault", name: "Private Vault", tier: 3, component: Vault },
  { path: "/archive", name: "Archive", tier: 3, component: Archive },
  { path: "/settings", name: "Settings", tier: 3, component: Settings },
  { path: "/help", name: "Help & Guide", tier: 3, component: Help },
  { path: "/features-guide", name: "Features Encyclopedia", tier: 3, component: FeaturesGuide },
];
