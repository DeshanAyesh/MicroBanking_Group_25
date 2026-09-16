import Link from "next/link";
import { BlockedNotice } from "@/components/BlockedNotice";
import { PageHeader } from "@/components/PageHeader";

export default function CustomersPage() {
  return <div className="container">
    <PageHeader title="Customer Management" description="Search, filter, register, edit and inspect customers." />
    <div className="actions" style={{marginBottom:16}}>
      <Link className="btn" href="/customers/new">Register customer</Link>
    </div>
    <div className="card">
      <div className="grid grid-2">
        <div className="field"><label>Search</label><input placeholder="Name, NIC, email..." /></div>
        <div className="field"><label>Branch filter</label><select><option>All branches</option></select></div>
      </div>
      <div style={{marginTop:16}}><BlockedNotice operation="customer list/search/filter query" /></div>
    </div>
  </div>;
}
