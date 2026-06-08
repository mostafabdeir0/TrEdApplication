"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Upload, FileText, X } from "lucide-react";

const schema = z.object({
  year_of_study: z.enum(
    ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"],
    { errorMap: () => ({ message: "Please select your year of study" }) }
  ),
  major: z.string().min(2, "Please enter your major"),
  why_join: z.string().min(100, "Please write at least 100 characters"),
  experience: z.string().min(100, "Please write at least 100 characters"),
  goals: z.string().min(50, "Please write at least 50 characters"),
  availability: z.string().min(10, "Please describe your availability"),
});

type FormData = z.infer<typeof schema>;

const STEP_FIELDS: (keyof FormData)[][] = [
  ["year_of_study", "major"],
  ["why_join"],
  ["experience"],
  ["goals", "availability"],
];

const STEP_META = [
  { title: "Personal Info", description: "Confirm your details" },
  { title: "Motivation", description: "Why do you want to join?" },
  { title: "Experience", description: "What do you bring to the table?" },
  { title: "Goals & Availability", description: "What are you looking for?" },
];

interface Props {
  fullName: string;
  userId: string;
}

export default function ApplyForm({ fullName, userId }: Props) {
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvError, setCvError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const whyJoin = watch("why_join") ?? "";
  const experience = watch("experience") ?? "";
  const goals = watch("goals") ?? "";

  async function handleNext() {
    const valid = await trigger(STEP_FIELDS[step] as Parameters<typeof trigger>[0]);
    if (valid) setStep((s) => s + 1);
  }

  async function onSubmit(data: FormData) {
    setSubmitError("");

    // Upload CV (optional — if it fails, submit without it)
    let cvPath: string | null = null;
    if (cvFile) {
      const ext = cvFile.name.split(".").pop() ?? "pdf";
      const path = `${userId}/cv.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("cvs")
        .upload(path, cvFile, { upsert: true });

      if (uploadError) {
        console.error("CV upload failed:", uploadError.message);
      } else {
        cvPath = path;
      }
    }

    const { error } = await supabase.from("applications").insert({
      user_id: userId,
      why_join: data.why_join,
      experience: data.experience,
      goals: data.goals,
      availability: data.availability,
      year_of_study: data.year_of_study,
      major: data.major,
      cv_url: cvPath,
      status: "submitted",
    });

    if (error) {
      setSubmitError("Failed to submit your application. Please try again.");
      return;
    }

    router.push("/dashboard/status");
  }

  const totalSteps = STEP_META.length;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        {/* Burgundy header with progress */}
        <div className="bg-burgundy px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Club Application</h1>
              <p className="mt-0.5 text-sm text-white/70">
                {STEP_META[step].description}
              </p>
            </div>
            <span className="text-sm font-semibold text-white/70">
              {step + 1} / {totalSteps}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>

          {/* Step dots + labels */}
          <div className="mt-3 flex items-start">
            {STEP_META.map((s, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full transition-all duration-300",
                    i < step
                      ? "bg-white"
                      : i === step
                      ? "bg-white ring-2 ring-white/40 ring-offset-1 ring-offset-burgundy"
                      : "bg-white/30"
                  )}
                />
                <span
                  className={cn(
                    "hidden text-center text-[10px] font-medium leading-tight sm:block",
                    i <= step ? "text-white" : "text-white/40"
                  )}
                >
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="min-h-72 px-8 py-8">
            {/* ── Step 1: Personal Info ── */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-gray-700">
                    Full Name
                  </p>
                  <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
                    {fullName || <span className="italic">Not set</span>}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    As it appears on your AUB profile
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="year_of_study"
                    className="text-sm font-medium text-gray-700"
                  >
                    Year of Study
                  </label>
                  <select
                    id="year_of_study"
                    {...register("year_of_study")}
                    className={cn(
                      "h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 text-sm",
                      "focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy/20",
                      errors.year_of_study &&
                        "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    )}
                  >
                    <option value="">Select your year…</option>
                    {(
                      [
                        "Freshman",
                        "Sophomore",
                        "Junior",
                        "Senior",
                        "Graduate",
                      ] as const
                    ).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  {errors.year_of_study && (
                    <p className="text-xs text-red-600">
                      {errors.year_of_study.message}
                    </p>
                  )}
                </div>

                <Input
                  id="major"
                  label="Major"
                  placeholder="e.g. Computer Science"
                  {...register("major")}
                  error={errors.major?.message}
                />
              </div>
            )}

            {/* ── Step 2: Motivation ── */}
            {step === 1 && (
              <div className="space-y-2">
                <Textarea
                  id="why_join"
                  label="Why do you want to join this club?"
                  placeholder="Share your motivation, what excites you, and how you see yourself contributing to the community…"
                  className="min-h-[200px]"
                  {...register("why_join")}
                  error={errors.why_join?.message}
                />
                <div className="flex justify-end">
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      whyJoin.length >= 100 ? "text-green-600" : "text-gray-400"
                    )}
                  >
                    {whyJoin.length} / 100 min
                  </span>
                </div>
              </div>
            )}

            {/* ── Step 3: Experience ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Textarea
                    id="experience"
                    label="Describe your relevant experience and skills"
                    placeholder="Include clubs, projects, coursework, internships, or personal projects that are relevant…"
                    className="min-h-[160px]"
                    {...register("experience")}
                    error={errors.experience?.message}
                  />
                  <div className="flex justify-end">
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        experience.length >= 100 ? "text-green-600" : "text-gray-400"
                      )}
                    >
                      {experience.length} / 100 min
                    </span>
                  </div>
                </div>

                {/* CV upload */}
                <div>
                  <p className="mb-1.5 text-sm font-medium text-gray-700">
                    Upload your CV{" "}
                    <span className="font-normal text-gray-400">(optional · PDF or Word · max 5 MB)</span>
                  </p>

                  {cvFile ? (
                    <div className="flex items-center justify-between rounded-lg border border-burgundy/30 bg-burgundy/5 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 shrink-0 text-burgundy" />
                        <span className="font-medium text-gray-800 truncate max-w-[260px]">
                          {cvFile.name}
                        </span>
                        <span className="text-gray-400">
                          ({(cvFile.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setCvFile(null); setCvError(""); }}
                        className="ml-2 rounded p-0.5 text-gray-400 hover:text-red-500"
                        aria-label="Remove CV"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center transition-colors hover:border-burgundy hover:bg-burgundy/5">
                      <Upload className="h-6 w-6 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        Click to browse for your CV
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            setCvError("File must be under 5 MB.");
                            return;
                          }
                          setCvError("");
                          setCvFile(file);
                        }}
                      />
                    </label>
                  )}

                  {cvError && (
                    <p className="mt-1 text-xs text-red-600">{cvError}</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 4: Goals & Availability ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Textarea
                    id="goals"
                    label="What do you hope to gain from this club?"
                    placeholder="Describe your personal and professional goals…"
                    {...register("goals")}
                    error={errors.goals?.message}
                  />
                  <div className="flex justify-end">
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        goals.length >= 50 ? "text-green-600" : "text-gray-400"
                      )}
                    >
                      {goals.length} / 50 min
                    </span>
                  </div>
                </div>

                <Textarea
                  id="availability"
                  label="What is your weekly availability?"
                  placeholder="e.g. Monday and Wednesday evenings, weekend afternoons…"
                  {...register("availability")}
                  error={errors.availability?.message}
                />

                {submitError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {submitError}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation footer */}
          <div className="flex items-center justify-between border-t border-gray-100 px-8 py-5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
            >
              ← Previous
            </Button>

            {step < totalSteps - 1 ? (
              <Button type="button" onClick={handleNext}>
                Next →
              </Button>
            ) : (
              <Button type="submit" loading={isSubmitting}>
                Submit Application
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
