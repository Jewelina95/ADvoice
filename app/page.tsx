import snapshot from "../public/data/project-snapshot.json";
import demo from "../public/demo/demo_result.json";
import { ResearchSite } from "./research-site";

export default function Home() {
  return <ResearchSite snapshot={snapshot} demo={demo} />;
}
