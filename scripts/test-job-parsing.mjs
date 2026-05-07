// Test createAssessmentReportJob to debug paymentStatus extraction

import { createAssessmentReportJob } from '../src/lib/server/assessment/retell-job.ts';

const payload = {
  event: 'call_analyzed',
  call: {
    call_id: 'call_8153280819ccc61607fa29a9e93',
    agent_id: 'agent_annie_test',
    transcript: 'Test transcript',
    transcript_text: 'Test transcript',
    summary: 'Test',
    metadata: {
      source: 'retell-voice-agent',
      customer_name: 'John Example',
      customer_email: 'johnexample@sharklasers.com',
      customer_phone: '+61468312233',
      company: 'Affinity Skin Cancer Clinics',
      payment_status: 'paid'
    },
    call_analysis: {
      custom_analysis_data: {
        caller_name: 'John Example',
        caller_email: 'johnexample@sharklasers.com',
        caller_phone: '+61468312233',
        company: 'Affinity Skin Cancer Clinics',
        payment_status: 'paid',
        assessment_ready: true,
        verbal_approval_given: true
      }
    },
    retell_llm_dynamic_variables: {}
  }
};

const job = createAssessmentReportJob(payload);

if (job) {
  console.log('Job created successfully');
  console.log('callId:', job.callId);
  console.log('paymentStatus:', job.paymentStatus);
  console.log('customerName:', job.customerName);
  console.log('customerEmail:', job.customerEmail);
  console.log('transcript length:', job.transcript?.length);
  console.log('Would trigger pipeline?', job.paymentStatus === 'paid' || job.paymentStatus === 'complete');
} else {
  console.log('Job creation returned null');
}
