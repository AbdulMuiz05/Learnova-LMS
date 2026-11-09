'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock3, LifeBuoy, Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Accordion } from '@/components/ui/accordion';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useGetPublicFaqsQuery, useGetPublicSettingsQuery } from '@/services/siteApi';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name'),
  email: z.string().trim().email('Enter a valid email address'),
  topic: z.enum(['course', 'payment', 'account', 'technical', 'other']),
  message: z.string().trim().min(10, 'Tell us a little more').max(2000, 'Message is too long'),
});

type Values = z.infer<typeof schema>;

const topics = [
  { value: 'course', label: 'Course content or enrollment' },
  { value: 'payment', label: 'Payment, invoice or refund' },
  { value: 'account', label: 'Account, email or password' },
  { value: 'technical', label: 'Video or platform issue' },
  { value: 'other', label: 'Something else' },
];

export function ContactContent() {
  const { data: settings } = useGetPublicSettingsQuery();
  const { data: faqData } = useGetPublicFaqsQuery();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', topic: 'course', message: '' },
  });

  const supportEmail = settings?.supportEmail ?? 'support@learnova.local';
  const phone = settings?.phone ?? '+1 (555) 010-2030';
  const address = settings?.address ?? 'Remote-first · Worldwide';

  const onSubmit = (values: Values) => {
    const topicLabel = topics.find((topic) => topic.value === values.topic)?.label ?? values.topic;
    const subject = encodeURIComponent(`[Support] ${topicLabel}`);
    const body = encodeURIComponent(
      `Name: ${values.name}\nEmail: ${values.email}\nTopic: ${topicLabel}\n\n${values.message}`
    );
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
    toast.info('Opening your email app. Send the message to reach our team.');
  };

  return (
    <div>
      <section className="border-b bg-gradient-to-br from-primary/[0.07] via-background to-amber-500/[0.05]">
        <div className="container-page py-14 sm:py-20">
          <span className="eyebrow">
            <LifeBuoy className="h-3.5 w-3.5 text-primary" />
            Support
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">How can we help?</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Questions about a course, a payment or your account? Send us a message and the team will get
            back to you. Check the FAQ below first — it may unblock you immediately.
          </p>
        </div>
      </section>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border bg-card p-5 shadow-soft sm:p-7">
          <h2 className="text-xl font-bold">Send a message</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This form opens your email client with the message prepared. Messages are not stored on the
            platform.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="field-label">
                  Your name
                </label>
                <Input id="contact-name" invalid={Boolean(errors.name)} {...register('name')} />
                {errors.name ? <p className="field-error">{errors.name.message}</p> : null}
              </div>
              <div>
                <label htmlFor="contact-email" className="field-label">
                  Email address
                </label>
                <Input
                  id="contact-email"
                  type="email"
                  invalid={Boolean(errors.email)}
                  {...register('email')}
                />
                {errors.email ? <p className="field-error">{errors.email.message}</p> : null}
              </div>
            </div>
            <div>
              <label htmlFor="contact-topic" className="field-label">
                Topic
              </label>
              <Select id="contact-topic" {...register('topic')}>
                {topics.map((topic) => (
                  <option key={topic.value} value={topic.value}>
                    {topic.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="contact-message" className="field-label">
                Message
              </label>
              <Textarea
                id="contact-message"
                rows={6}
                placeholder="Include the course name, order reference or a link if relevant."
                invalid={Boolean(errors.message)}
                {...register('message')}
              />
              {errors.message ? <p className="field-error">{errors.message.message}</p> : null}
            </div>
            <Button type="submit" size="lg">
              <Send className="h-4 w-4" />
              Compose email
            </Button>
          </form>

          <Alert variant="info" className="mt-5">
            Prefer direct email? Write to{' '}
            <a href={`mailto:${supportEmail}`} className="font-semibold underline">
              {supportEmail}
            </a>
            . Include your account email so we can find your enrollment.
          </Alert>
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="text-base font-bold">Contact details</h2>
            <ul className="mt-4 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Mail className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium">Email</p>
                  <a href={`mailto:${supportEmail}`} className="text-muted-foreground hover:text-foreground">
                    {supportEmail}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Phone className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-muted-foreground">{phone}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground">{address}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Clock3 className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-medium">Response time</p>
                  <p className="text-muted-foreground">Within 1–2 business days</p>
                </div>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-soft">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <MessageSquare className="h-4 w-4 text-primary" />
              Payment questions
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Course access is granted only after the payment provider confirms your payment. If a charge
              succeeded but a course is locked, send us the invoice number from your payments page.
            </p>
          </section>
        </aside>
      </div>

      {faqData?.faqs.length ? (
        <section className="border-t bg-muted/20">
          <div className="container-page grid gap-8 py-14 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <span className="eyebrow">FAQ</span>
              <h2 className="mt-3 text-2xl font-bold">Quick answers</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The most common questions learners ask before enrolling.
              </p>
            </div>
            <Accordion
              allowMultiple={false}
              defaultOpen={[faqData.faqs[0]._id]}
              items={faqData.faqs.slice(0, 6).map((faq) => ({
                id: faq._id,
                title: faq.question,
                content: <p>{faq.answer}</p>,
              }))}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
