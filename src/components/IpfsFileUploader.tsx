import { ipfsGatewayUrl } from "@/lib/ipfs";
import axios from "axios";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import { useMutation } from "wagmi/query";

export type InfuraPinResponse = {
  Hash: string;
};

export const pinFile = async (
  file: File | Blob | string,
  options?: { signal?: AbortSignal }
) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post<InfuraPinResponse>(
    "https://api.juicebox.money/api/ipfs/file",
    formData,
    {
      maxContentLength: Infinity,
      signal: options?.signal,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};

export function IpfsImageUploader({
  onUploadSuccess,
  disabled = false,
}: {
  onUploadSuccess: (cid: string) => void;
  disabled?: boolean;
}) {
  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      const ipfsCid = await pinFile(file);
      onUploadSuccess(ipfsCid.Hash);

      return ipfsCid;
    },
  });

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadFile.mutate(file);
  };

  return (
    <div className="mb-5">
      <input
        className={twMerge(
          "text-sm block w-full rounded border border-solid border-limeGreenOpacity bg-clip-padding px-3 py-[0.32rem]\
          font-normal text-notWhite transition duration-300 ease-in-out file:-mx-3 file:-my-[0.32rem] file:overflow-hidden\
          file:rounded-none file:border-0 file:border-solid file:border-inherit file:bg-deepPink file:px-3 file:py-[0.32rem]\
          file:text-lightPurple file:transition file:duration-150 file:ease-in-out file:[border-inline-end-width:1px]\
          file:[margin-inline-end:0.75rem] hover:file:bg-darkPink focus:border-primary\
          focus:text-zinc-700 focus:shadow-te-primary focus:outline-none dark:border-zinc-600 dark:text-zinc-200\
          dark:file:bg-zinc-700 dark:file:text-zinc-100 dark:focus:border-primary",
          (disabled || uploadFile.isPending) && "file:bg-zinc-100 file:text-zinc-400 hover:file:bg-zinc-100 cursor-not-allowed")}
        id="file_input"
        type="file"
        disabled={disabled || uploadFile.isPending}
        onChange={handleFileChange}
      />
      {uploadFile.isPending && (
        <div className="text-md text-gray-500">Uploading...</div>
      )}
      {uploadFile.error && (
        <div className="text-md text-red-500">
          Logo upload failed, try again.
        </div>
      )}
      {uploadFile.data && (
        <div className="overflow-hidden mt-3">
          <Image
            src={ipfsGatewayUrl(uploadFile.data.Hash)}
            alt="Uploaded file"
            width={80}
            height={200}
          />
        </div>
      )}
    </div>
  );
}
