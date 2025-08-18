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
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          <div className="flex gap-10 flex-col">
            <h1 className="text-2xl md:text-5xl max-w-2xl tracking-tighter text-center font-regular">
              <span className="text-spektr-cyan-50">
                Are you thinking about
                <br />
                <span className="font-bold">where2buy</span>
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center">
              Type/paste the list of items you want to buy, or upload an image
              of your shopping list and we'll help you find the best places to
              purchase them.
            </p>
          </div>

          {/* Input + Upload + Search in one row */}
          <div className="flex flex-col md:flex-col gap-5 w-full max-w-2xl">
            {/* Input */}
            <Input
              placeholder="Type or paste your items here..."
              value={list}
              onChange={(e) => setList(e.target.value)}
              className="flex-1 h-19 px-4"
            />

            {/* Upload */}
            <label className="flex items-center justify-center h-12 px-4 border rounded-md cursor-pointer text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <Upload className="w-6 h-4 mr-4" /> Upload an image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {/* Search Button */}
            <Button size="lg" className="h-12 px-6 flex items-center gap-2">
              Search <MoveRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Show uploaded file name */}
          {file && (
            <p className="text-sm text-muted-foreground mt-2">
              Uploaded: {file.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
