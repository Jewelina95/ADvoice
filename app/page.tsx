import snapshot from "../public/data/project-snapshot.json";
import { ResearchSite } from "./research-site";

export default function Home() {
  return <ResearchSite snapshot={snapshot} />;
}
