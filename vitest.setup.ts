import { installContent } from "@/features/designer/content";
import { seedContent } from "@/features/designer/data/seed";

// The app loads its catalog and plans from the API; tests use the seed data instead.
installContent(seedContent);
