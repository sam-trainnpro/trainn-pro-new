import { Helmet } from "react-helmet";
import {
  publicPageMetadata,
  type PageMetadata as Metadata,
} from "@shared/page-metadata";

type Props = { page: keyof typeof publicPageMetadata } | Metadata;

export default function PageMetadata(props: Props) {
  const metadata: Metadata = "page" in props ? publicPageMetadata[props.page] : props;
  return (
    <Helmet>
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      <meta name="robots" content={metadata.noindex ? "noindex, follow" : "index, follow"} />
    </Helmet>
  );
}
