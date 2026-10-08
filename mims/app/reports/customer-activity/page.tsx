"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";


export default function Report() {

  const [data,setData] = useState<any[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");


  useEffect(()=>{

    fetch("/api/reports/customer-activity")

      .then(res=>{

        if(!res.ok){
          throw new Error("Failed to fetch report");
        }

        return res.json();

      })

      .then(result=>{

        setData(result.results || []);
        setLoading(false);

      })

      .catch(err=>{

        setError(err.message);
        setLoading(false);

      });

  },[]);



  return (

    <div className="container">

      <PageHeader 
        title="Customer Activity"
        description="total deposits, total withdrawals and net activity."
      />


      <div className="card">


      {loading && (
        <div>
          Loading report...
        </div>
      )}



      {error && (
        <p className="error">{error}</p>
      )}



      {!loading && !error && (

      <div className="table-wrap">

      <table>

        <thead>

          <tr>
            <th>Customer ID</th>
            <th>Name</th>
            <th>Total Deposits</th>
            <th>Total Withdrawals</th>
            <th>Net Activity</th>
          </tr>

        </thead>


        <tbody>

        {
          data.map((row)=>(
            <tr key={row.customer_id}>

              <td>{row.customer_id}</td>

              <td>{row.customer_name}</td>

              <td>
                {Number(row.total_deposits).toFixed(2)}
              </td>

              <td>
                {Number(row.total_withdrawals).toFixed(2)}
              </td>

              <td>
                {Number(row.net_activity).toFixed(2)}
              </td>

            </tr>
          ))
        }

        </tbody>


      </table>

      </div>

      )}

      </div>

    </div>

  );

}
