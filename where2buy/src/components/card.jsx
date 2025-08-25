import { useState } from "react";
import { MoveRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Hero5 = () => {
  const [list, setList] = useState("");
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full sm:px-3 lg:px-2 ">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center text-center py-16 sm:py-24 lg:py-32 gap-8">
          {/* Heading */}
          <div className="flex flex-col gap-6 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
              <span className="text-spektr-cyan-50">
                Are you thinking about
                <br />
                <span className="font-bold">where2buy</span>
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
              Type/paste the list of items you want to buy, or upload an image
              of your shopping list and we'll help you find the best places to
              purchase them.
            </p>
          </div>

          {/* Card */}
          <div className="w-full max-w-2xl flex flex-col gap-6 max-h-3xl">
            {/* Input Box */}
            <div className="rounded-xl bg-white p-6 sm:p-8 text-left space-y-3">
              <label
                htmlFor="items-input"
                className="block text-sm font-medium !mb-2 text-gray-700 "
              >
                Enter your items
              </label>

              <Input
                id="items-input"
                placeholder="Type or paste your items here..."
                value={list}
                onChange={(e) => setList(e.target.value)}
                className="w-full !px-4 !py-3 text-base"
              />
            </div>

            {/* Upload Button */}
            <label className="flex items-center justify-center h-12 px-4 border rounded-md cursor-pointer text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition">
              <Upload className="w-5 h-5 mr-2" /> Upload an image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {/* Search Button */}
            <Button
              size="lg"
              className="h-12 px-6 flex items-center justify-center gap-2"
            >
              Search <MoveRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Uploaded File */}
          {file && (
            <p className="text-sm text-muted-foreground mt-4">
              Uploaded: {file.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
